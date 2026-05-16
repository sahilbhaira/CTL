interface PreviousPageHistory {
  goBack: () => void;
}

export const goToPreviousPage = (history: PreviousPageHistory) => {
  history.goBack();
};

export const isQuoteAuthPath = (pathname: string) =>
  pathname === '/quote' ||
  pathname === '/status' ||
  pathname === '/quotes' ||
  pathname.startsWith('/quotes/');
