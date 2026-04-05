declare module 'pdfmake/build/pdfmake' {
  const pdfMake: {
    createPdf: (docDefinition: unknown, tableLayouts?: unknown, fonts?: unknown) => {
      download: (filename?: string) => void;
      open: () => void;
      print: () => void;
    };
  };
  export default pdfMake;
}
