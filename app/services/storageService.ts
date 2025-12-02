'use client';

/**
 * Service voor lokale file opslag (data URLs)
 * Bestanden worden opgeslagen als base64 data URLs in de Zustand store
 */

/**
 * Converteer een File naar een data URL (base64)
 * @param file Het bestand om te converteren
 * @returns Promise met de data URL string
 */
function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Kon bestand niet lezen'));
      }
    };
    reader.onerror = () => reject(new Error('Fout bij lezen van bestand'));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload een bestand lokaal (converteer naar data URL)
 * @param file Het bestand om te uploaden
 * @param folder Niet gebruikt (behouden voor compatibiliteit)
 * @param fileName Niet gebruikt (behouden voor compatibiliteit)
 * @returns De data URL van het bestand, of null als conversie faalt
 */
export async function uploadFile(
  file: File,
  folder: string = 'team-logos',
  fileName?: string
): Promise<string | null> {
  try {
    console.log('📤 Converting file to data URL:', { fileName: file.name, fileSize: file.size, fileType: file.type });

    // Converteer bestand naar data URL
    const dataURL = await fileToDataURL(file);

    console.log('✅ File converted successfully, data URL length:', dataURL.length);
    return dataURL;
  } catch (error) {
    console.error('❌ Error converting file:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Bestand conversie mislukt: ' + String(error));
  }
}

/**
 * Verwijder een bestand (no-op voor lokale opslag)
 * @param filePath Het pad naar het bestand (niet gebruikt)
 * @returns true (altijd succesvol, want er is niets te verwijderen)
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  // Voor lokale opslag hoeven we niets te verwijderen
  // De data URL wordt automatisch verwijderd wanneer het team wordt verwijderd
  return true;
}

/**
 * Check of lokale storage beschikbaar is (altijd true)
 */
export function isStorageAvailable(): boolean {
  // Lokale opslag is altijd beschikbaar
  return true;
}



