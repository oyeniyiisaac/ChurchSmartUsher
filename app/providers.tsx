"use client";

import { ApolloProvider } from "@apollo/client";
import type { ReactNode } from "react";
import { useState } from "react";

import { createApolloClient } from "@/api/apollo-client";

export function AppProviders({ children }: Readonly<{ children: ReactNode }>) {
  const [client] = useState(createApolloClient);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
