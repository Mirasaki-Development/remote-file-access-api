import { getFiles } from '../files';
import { debugLog } from '../../debug';
import { rm, writeFile, readFile } from 'fs/promises';

export const getAllJSONFiles = async (targetPath: string) => {
  const allJSONFiles = getFiles(targetPath, [ '.json' ]);
  debugLog(`Found ${allJSONFiles.length} JSON files in ${targetPath}`);
  return (await Promise.all(
    allJSONFiles.map(async (pathToJSON) => {
      const textData = await readFile(pathToJSON, { encoding: 'utf-8' });
      try {
        return JSON.parse(textData);
      }
      catch (err) {
        console.error(`Error parsing JSON file at ${pathToJSON}`, err);
        // Either invalid syntax in JSON or not a file
        // full path is shown in those errors, avoid
        return null;
      }
    })
  )).filter((e) => !!e); // Keep only truthy
};

export const getJSONFile = async (targetPath: string, identifier: string) => {
  const finalPath = targetPath + `/${ identifier }.json`;
  debugLog(`Attempting to get JSON file from ${finalPath}`);
  try {
    const textData = await readFile(finalPath, { encoding: 'utf-8' });
    return JSON.parse(textData);
  }
  catch (err) {
    console.error(`Error reading JSON file from ${finalPath}`, err);
    // Either invalid syntax in JSON or not a file
    // full path is shown in those errors, avoid
    return null;
  }
};

export const putJSONFile = async (
  targetPath: string,
  identifier: string,
  newJSONContent: unknown
) => {
  const finalPath = targetPath + `/${ identifier }.json`;
  debugLog(`Attempting to put JSON file to ${finalPath}`);
  try {
    await writeFile(
      finalPath,
      JSON.stringify(newJSONContent, null, 2),
      { encoding: 'utf-8'}
    );
    return true;
  }
  catch (err) {
    console.error(`Error writing JSON file to ${finalPath}`, err);
    // Either invalid syntax in JSON or not a file
    // full path is shown in those errors, avoid
    return null;
  }
};

export const deleteJSONFile = async (targetPath: string, identifier: string) => {
  const finalPath = targetPath + `/${ identifier }.json`;
  debugLog(`Attempting to delete JSON file at ${finalPath}`);
  try {
    await rm(finalPath, { recursive: false, force: false });
  }
  catch (err) {
    console.error(`Error deleting JSON file at ${finalPath}`, err);
    // Either invalid syntax in JSON or not a file
    // full path is shown in those errors, avoid
    return null;
  }
};
