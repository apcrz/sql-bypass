export function downloadCSV(data: any[], filename: string) {
   if (!data || data.length === 0) {
      alert('Nada para exportar!');
      return;
   }

   const headers = Object.keys(data[0]);

   const csvContent = [
      headers.join(','),
      ...data.map(row =>
         headers.map(fieldName => {
            let value = row[fieldName];

            if (value === null || value === undefined) return '';

            value = value.toString();

            if (value.search(/("|,|\n)/g) >= 0) {
               value = `"${value.replace(/"/g, '""')}"`;
            }

            return value;
         }).join(',')
      )
   ].join('\n');

   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
   const url = URL.createObjectURL(blob);
   const link = document.createElement('a');

   link.setAttribute('href', url);
   link.setAttribute('download', `${filename}.csv`);
   link.style.visibility = 'hidden';

   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
}