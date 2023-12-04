function formatDateTimeForSorting(dateTime) {
	const year = dateTime.getFullYear();
	const month = String(dateTime.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
	const day = String(dateTime.getDate()).padStart(2, '0');
	const hours = String(dateTime.getHours()).padStart(2, '0');
	const minutes = String(dateTime.getMinutes()).padStart(2, '0');
	const seconds = String(dateTime.getSeconds()).padStart(2, '0');
  
	return `${year}-${month}-${day}_${hours}:${minutes}:${seconds}`;
  }