'use client';

/**
 * Service voor file uploads naar Supabase Storage
 */

import { createClient } from '@/lib/supabase/client';

function getSupabase() {
  try {
    return createClient();
  } catch (error) {
    // Supabase niet geconfigureerd - return null
    return null;
  }
}

/**
 * Upload een bestand naar Supabase Storage
 * @param file Het bestand om te uploaden
 * @param folder De folder in de storage bucket (bijv. 'team-logos')
 * @param fileName Optionele custom filename, anders wordt de originele naam gebruikt
 * @returns De publieke URL van het geüploade bestand, of null als upload faalt
 */
export async function uploadFile(
  file: File,
  folder: string = 'team-logos',
  fileName?: string
): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn('Supabase niet geconfigureerd - file upload niet mogelijk');
    return null;
  }

  try {
    // Genereer een unieke filename als er geen is gegeven
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const finalFileName = fileName || `${timestamp}-${randomString}.${fileExt}`;
    const filePath = `${folder}/${finalFileName}`;

    // Upload het bestand
    const { data, error } = await supabase.storage
      .from('team-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Voorkom overwrites
      });

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    // Haal de publieke URL op
    const { data: urlData } = supabase.storage
      .from('team-assets')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Kon publieke URL niet ophalen');
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadFile:', error);
    return null;
  }
}

/**
 * Verwijder een bestand uit Supabase Storage
 * @param filePath Het pad naar het bestand in storage
 * @returns true als verwijderen succesvol was, false anders
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) {
    return false;
  }

  try {
    // Extract folder en filename uit de volledige URL
    const url = new URL(filePath);
    const pathParts = url.pathname.split('/');
    const storagePath = pathParts.slice(pathParts.indexOf('team-assets') + 1).join('/');

    const { error } = await supabase.storage
      .from('team-assets')
      .remove([storagePath]);

    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteFile:', error);
    return false;
  }
}

/**
 * Check of Supabase Storage is geconfigureerd
 */
export function isStorageAvailable(): boolean {
  try {
    const supabase = getSupabase();
    return supabase !== null;
  } catch {
    return false;
  }
}

