export const buffer = {
  async arrayBufferToBuffer(data: ArrayBuffer): Promise<Buffer> {
    return window.shared.Buffer.from(data);
  },
};
