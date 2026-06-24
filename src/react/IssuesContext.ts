import { createContext, useContext } from 'react';
import type { CompileIssue, Issue } from '../core';

export type AnyIssue = Issue | CompileIssue;

export const IssuesContext = createContext<AnyIssue[]>([]);

export function useIssues(nodeId: string) {
  const issues = useContext(IssuesContext);
  return issues.filter((i) => i.nodeId === nodeId);
}
