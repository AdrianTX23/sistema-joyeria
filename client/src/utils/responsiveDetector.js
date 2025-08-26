// Utility para detectar responsive design
export const getScreenInfo = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  let breakpoint = 'xs';
  let deviceType = 'mobile';
  
  if (width >= 1024) {
    breakpoint = 'lg';
    deviceType = 'desktop';
  } else if (width >= 768) {
    breakpoint = 'md';
    deviceType = 'tablet';
  } else if (width >= 640) {
    breakpoint = 'sm';
    deviceType = 'mobile';
  } else {
    breakpoint = 'xs';
    deviceType = 'mobile';
  }
  
  return {
    width,
    height,
    breakpoint,
    deviceType,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024
  };
};

export const addResizeListener = (callback) => {
  const handleResize = () => {
    callback(getScreenInfo());
  };
  
  window.addEventListener('resize', handleResize);
  
  // Llamada inicial
  handleResize();
  
  // Retornar función para limpiar
  return () => window.removeEventListener('resize', handleResize);
};

export const updateScreenInfo = () => {
  const info = getScreenInfo();
  
  const screenWidthElement = document.getElementById('screen-width');
  const deviceTypeElement = document.getElementById('device-type');
  const breakpointElement = document.getElementById('breakpoint');
  
  if (screenWidthElement) {
    screenWidthElement.textContent = `${info.width}px x ${info.height}px`;
  }
  
  if (deviceTypeElement) {
    deviceTypeElement.textContent = `${info.deviceType} (${info.isMobile ? 'Mobile' : info.isTablet ? 'Tablet' : 'Desktop'})`;
  }
  
  if (breakpointElement) {
    breakpointElement.textContent = `${info.breakpoint.toUpperCase()} (${info.width}px)`;
  }
};
