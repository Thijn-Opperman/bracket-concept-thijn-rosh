import { toPng, toJpeg, toSvg } from 'html-to-image';
import jsPDF from 'jspdf';

export async function exportBracketAsImage(
  elementId: string,
  format: 'png' | 'jpeg' = 'png'
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Bracket element not found');
  }

  try {
    const dataUrl =
      format === 'png'
        ? await toPng(element, { quality: 1.0, pixelRatio: 2 })
        : await toJpeg(element, { quality: 1.0, pixelRatio: 2 });

    const link = document.createElement('a');
    link.download = `bracket-${Date.now()}.${format}`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Error exporting image:', error);
    throw error;
  }
}

export async function exportBracketAsPDF(elementId: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Bracket element not found');
  }

  try {
    const dataUrl = await toPng(element, { quality: 1.0, pixelRatio: 2 });
    
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 297; // A4 width in mm
    const imgHeight = (element.offsetHeight * imgWidth) / element.offsetWidth;

    pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`bracket-${Date.now()}.pdf`);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
}

