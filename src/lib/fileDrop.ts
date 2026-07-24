export async function extractFilesFromEntry(entry: any): Promise<File[]> {
  const files: File[] = [];

  const getFiles = async (e: any): Promise<void> => {
    if (e.isFile) {
      const file = await new Promise<File>((resolve, reject) => {
        e.file(resolve, reject);
      });
      files.push(file);
    } else if (e.isDirectory) {
      const dirReader = e.createReader();
      let allEntries: any[] = [];
      let entries = await new Promise<any[]>((resolve, reject) => {
        dirReader.readEntries(resolve, reject);
      });
      while (entries.length > 0) {
        allEntries = allEntries.concat(entries);
        entries = await new Promise<any[]>((resolve, reject) => {
          dirReader.readEntries(resolve, reject);
        });
      }
      for (const child of allEntries) {
        await getFiles(child);
      }
    }
  };

  await getFiles(entry);
  return files;
}

export async function extractFilesFromDataTransfer(items: DataTransferItemList): Promise<File[]> {
  const files: File[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind === 'file') {
      const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
      if (entry) {
        const entryFiles = await extractFilesFromEntry(entry);
        files.push(...entryFiles);
      } else {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }
  }

  return files;
}
