/// <reference types="jest" />
/// <reference types="node" />

// Ensure process is available globally
declare var process: NodeJS.Process;

declare module 'fast-check' {
  export * from 'fast-check';
}

declare module '@supabase/supabase-js' {
  export * from '@supabase/supabase-js';
}

declare module '@supabase/ssr' {
  export interface CookieOptions {
    maxAge?: number;
    path?: string;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'lax' | 'strict' | 'none';
  }

  export function createServerClient<Database = any>(
    supabaseUrl: string,
    supabaseKey: string,
    options: {
      cookies: {
        get(name: string): string | undefined;
        set?(name: string, value: string, options: CookieOptions): void;
        remove?(name: string, options: CookieOptions): void;
      };
    }
  ): any;
  
  export function createBrowserClient<Database = any>(
    supabaseUrl: string,
    supabaseKey: string
  ): any;
}

declare module 'next/headers' {
  export function cookies(): Promise<{
    get(name: string): { value: string } | undefined;
    set(name: string, value: string, options?: any): void;
    delete(name: string): void;
  }>;
  
  export function headers(): Promise<Headers>;
}

declare module 'react' {
  import * as React from 'react';
  export = React;
  export as namespace React;
}

declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';
  export const ChevronDown: FC<SVGProps<SVGSVGElement>>;
  export const ChevronRight: FC<SVGProps<SVGSVGElement>>;
  export const ArrowUpDown: FC<SVGProps<SVGSVGElement>>;
  export const ArrowUp: FC<SVGProps<SVGSVGElement>>;
  export const ArrowDown: FC<SVGProps<SVGSVGElement>>;
}

declare module 'next/navigation' {
  export function useRouter(): {
    push: (url: string) => void;
    replace: (url: string) => void;
    back: () => void;
    forward: () => void;
    refresh: () => void;
    prefetch: (url: string) => void;
  };
  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
}
