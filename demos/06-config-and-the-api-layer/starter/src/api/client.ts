import axios from 'axios';

/** ONE hard-coded instance. Lab 2.1 wires it to config and adds the no-interceptor twin. */
// TODO(lab-2.1): baseURL + timeout from env; export `api` and a bare `bareApi`
export const api = axios.create({ baseURL: 'https://dummyjson.com' });
