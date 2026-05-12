import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { edgeFunctionsApi } from '../services/api/edgeFunctionsApi';

export const store = configureStore({
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(edgeFunctionsApi.middleware),
  reducer: {
    [edgeFunctionsApi.reducerPath]: edgeFunctionsApi.reducer
  }
});

setupListeners(store.dispatch);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

