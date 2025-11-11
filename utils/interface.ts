export interface User {
  userId: string;
  email?: string; // Optional, as email might come from auth microservice
  name?: string;
}