export async function parseJsonSafely(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}
