export async function saveToBackend(fileId: string, content: string) {
    console.log(`Saving file ${fileId} at ${new Date().toLocaleTimeString()}...`);
    await new Promise((resolve) => setTimeout(resolve, 1600)); // simulate delay
    console.log("File saved:", fileId, content.slice(0, 40) + "...");
    return { success: true, timestamp: new Date().toISOString() };
  }
  