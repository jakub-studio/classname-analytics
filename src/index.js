import { glob } from "glob";
import ora from "ora";
import { join } from "path";
import { readFile } from "fs/promises";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";

// the below is ugly but if I try using the import syntax, the build will break
const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");

// process exit
const handleSigTerm = () => process.exit(0)

process.on('SIGINT', handleSigTerm)
process.on('SIGTERM', handleSigTerm)

// consts

console.log({
	cwd: process.cwd(),
	argv: process.argv.slice(2)
});

const parsedSymbol = Symbol.for("ClassNameAnalytics.ParsedStatus");
const tailwindFunctions = ["clsx", "twMerge"];
const jsxClassNameAttributes = ["className", "class"];

const obj = {
	"relative": {
		occurrences: [],
		siblings: {
			"top-0": [
				"src/index.js (L10)"
			]
		}

	},
	"top-0": {
		"relative": [
			"src/index.js (L10)",
			["src/index.js?lineStart=10&lineEnd=10", 10]
		]
	}
}

yargs(hideBin(process.argv))
	.command("$0", "analyze classnames", () => { }, async (argv) => {
		console.log({ argv });

		const spinner = ora('Running glob pattern').start();
		const globData = await glob("**/*.{ts,js,tsx,jsx}", { ignore: 'node_modules/**' });
		const files = globData.map(e => ({
			relative: e,
			absolute: join(process.cwd(), e)
		}));

		spinner.text = `Reading and processing ${files.length} files`;

		const data = {
			classNames: {}
		}

		for (const [index, file] of files.entries()) {
			spinner.suffixText = `(${index + 1}/${files.length})`;

			const fileContents = await readFile(file.absolute, { encoding: "utf-8" });
			file.contents = fileContents;
			try {
				file.ast = parse(fileContents, { sourceType: "unambiguous", sourceFilename: file.relative, plugins: ["typescript", "jsx"] })

			} catch (e) {
				console.error("parse error for " + file.absolute);
				console.error(e);
				continue;
			}

			traverse(file.ast, {
				JSXAttribute: path => {
					const attributeName = path.node.name.name;
					if (!jsxClassNameAttributes.includes(attributeName)) return;
					if (!path.node.value) return;
					if (path.node.value.type !== "StringLiteral") return;

					const classNames = path.node.value.value.trim();

					if (classNames.trim() === "") return;

					const classNamesSplit = classNames.split(/ +/);

					// console.log(attributeName + "=" + JSON.stringify(classNamesSplit));

					const loc = file.relative + ` (L${path.node.loc.start.line})`;
					for (const [index, className] of classNamesSplit.entries()) {
						const siblings = classNamesSplit.filter(cn => cn !== className);
						if (!data.classNames[className]) {
							data.classNames[className] = {
								occurrences: [loc],
								siblings: {}
							}

							siblings.forEach(s => {
								data.classNames[className].siblings[s] = [loc]
							});
						} else {
							data.classNames[className].occurrences.push(loc);
							siblings.forEach(s => {
								if (data.classNames[className].siblings[s]) {
									data.classNames[className].siblings[s].push(loc);
								} else {
									data.classNames[className].siblings[s] = [loc]

								}
							})
						}

					}
				}
			})
		}
		console.log(JSON.stringify(data, null, 4));
	})
	.parseAsync();