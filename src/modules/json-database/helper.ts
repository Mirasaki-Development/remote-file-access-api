import { readFileSync, writeFileSync, rmSync } from 'fs';
import { getFiles } from '../files';

export const getAllJSONFiles = (targetPath: string) => {
  const allJSONFiles = getFiles(targetPath, [ '.json' ]);
  return allJSONFiles
    .map((pathToJSON) => {
      const textData = readFileSync(pathToJSON, { encoding: 'utf-8' });
      try {
        return JSON.parse(textData);
      }
      catch {
        // Either invalid syntax in JSON or not a file
        // full path is shown in those errors, avoid
        return null;
      }
    })
    .filter((e) => !!e); // Keep only truthy
};

export const getJSONFile = (targetPath: string, identifier: string) => {
  const finalPath = targetPath + `/${ identifier }.json`;
  try {
    const textData = readFileSync(finalPath, { encoding: 'utf-8' });
    return JSON.parse(textData);
  }
  catch (err) {
    // Either invalid syntax in JSON or not a file
    // full path is shown in those errors, avoid
    return null;
  }
};

export const putJSONFile = (
  targetPath: string,
  identifier: string,
  newJSONContent: unknown
) => {
  const finalPath = targetPath + `/${ identifier }.json`;
  try {
    writeFileSync(
      finalPath,
      JSON.stringify(newJSONContent, null, 2),
      { encoding: 'utf-8' }
    );
    return true;
  }
  catch {
    // Either invalid syntax in JSON or not a file
    // full path is shown in those errors, avoid
    return null;
  }
};

export const deleteJSONFile = (targetPath: string, identifier: string) => {
  const finalPath = targetPath + `/${ identifier }.json`;
  try {
    rmSync(finalPath, { recursive: false, force: false });
  }
  catch (err) {
    // Either invalid syntax in JSON or not a file
    // full path is shown in those errors, avoid
    return null;
  }
};
