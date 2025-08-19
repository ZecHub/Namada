declare module 'dom-to-image-more' {
  const domToImage: {
    toBlob(node: HTMLElement): Promise<Blob>;
    toPng(node: HTMLElement): Promise<string>;
    toJpeg(node: HTMLElement, options?: any): Promise<string>;
    toSvg(node: HTMLElement): Promise<string>;
  };
  export default domToImage;
}