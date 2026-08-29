import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {
  /**
   * Export JSON array into styled Excel file and trigger download
   * @param json Array of formatted objects to be exported
   * @param excelFileName Target file name (without extension)
   * @param sheetName Name of the worksheet tab (default: 'Data')
   */
  exportAsExcelFile(json: any[], excelFileName: string, sheetName: string = 'Data'): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);

    // Auto-fit column widths for better presentation
    if (json.length > 0) {
      const colWidths = Object.keys(json[0]).map(key => {
        const maxLen = Math.max(
          key.length,
          ...json.map(item => (item[key] ? String(item[key]).length : 0))
        );
        return { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
      });
      worksheet['!cols'] = colWidths;
    }

    const workbook: XLSX.WorkBook = { Sheets: { [sheetName]: worksheet }, SheetNames: [sheetName] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, excelFileName);
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const EXCEL_EXTENSION = '.xlsx';
    const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
    const formattedDate = new Date().toISOString().split('T')[0];
    saveAs(data, `${fileName}_${formattedDate}${EXCEL_EXTENSION}`);
  }
}
