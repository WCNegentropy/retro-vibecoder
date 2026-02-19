/**
 * Web Components Enrichment Strategy
 *
 * Fills web frontend projects with real component logic:
 * - Header/Nav component
 * - Footer component
 * - Layout wrapper
 */

import type { EnrichmentStrategy, TechStack, EnrichmentFlags, EnrichmentContext } from '../../../types.js';

function generateReactComponents(projectName: string): Record<string, string> {
  return {
    'src/components/Header.tsx': `interface HeaderProps {
  title?: string;
}

export function Header({ title = '${projectName}' }: HeaderProps) {
  return (
    <header style={{ padding: '1rem 2rem', borderBottom: '1px solid #e2e8f0' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{title}</h1>
        <ul style={{ display: 'flex', gap: '1rem', listStyle: 'none', margin: 0, padding: 0 }}>
          <li><a href="/">Home</a></li>
          <li><a href="/about">About</a></li>
        </ul>
      </nav>
    </header>
  );
}
`,
    'src/components/Footer.tsx': `export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ padding: '1rem 2rem', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
      <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
        &copy; {year} ${projectName}. All rights reserved.
      </p>
    </footer>
  );
}
`,
    'src/components/Layout.tsx': `import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1, padding: '2rem' }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
`,
  };
}

function generateVueComponents(projectName: string): Record<string, string> {
  return {
    'src/components/AppHeader.vue': `<script setup lang="ts">
defineProps<{ title?: string }>();
</script>

<template>
  <header class="header">
    <nav class="nav">
      <h1 class="title">{{ title ?? '${projectName}' }}</h1>
      <ul class="links">
        <li><RouterLink to="/">Home</RouterLink></li>
        <li><RouterLink to="/about">About</RouterLink></li>
      </ul>
    </nav>
  </header>
</template>

<style scoped>
.header { padding: 1rem 2rem; border-bottom: 1px solid #e2e8f0; }
.nav { display: flex; justify-content: space-between; align-items: center; }
.title { font-size: 1.25rem; font-weight: bold; }
.links { display: flex; gap: 1rem; list-style: none; margin: 0; padding: 0; }
</style>
`,
    'src/components/AppFooter.vue': `<template>
  <footer class="footer">
    <p>&copy; {{ year }} ${projectName}. All rights reserved.</p>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear();
</script>

<style scoped>
.footer { padding: 1rem 2rem; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 0.875rem; }
</style>
`,
  };
}

function generateSvelteComponents(projectName: string): Record<string, string> {
  return {
    'src/lib/components/Header.svelte': `<script lang="ts">
  export let title = '${projectName}';
</script>

<header>
  <nav>
    <h1>{title}</h1>
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/about">About</a></li>
    </ul>
  </nav>
</header>

<style>
  header { padding: 1rem 2rem; border-bottom: 1px solid #e2e8f0; }
  nav { display: flex; justify-content: space-between; align-items: center; }
  h1 { font-size: 1.25rem; font-weight: bold; }
  ul { display: flex; gap: 1rem; list-style: none; margin: 0; padding: 0; }
</style>
`,
    'src/lib/components/Footer.svelte': `<footer>
  <p>&copy; {new Date().getFullYear()} ${projectName}. All rights reserved.</p>
</footer>

<style>
  footer { padding: 1rem 2rem; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 0.875rem; }
</style>
`,
  };
}

export const WebComponentsEnrichStrategy: EnrichmentStrategy = {
  id: 'enrich-web-components',
  name: 'Web Component Logic Fill',
  priority: 20,

  matches: (stack: TechStack, flags: EnrichmentFlags) =>
    flags.fillLogic && stack.archetype === 'web',

  apply: async (context: EnrichmentContext) => {
    const { files, stack, projectName } = context;

    let components: Record<string, string> = {};

    switch (stack.framework) {
      case 'react':
      case 'nextjs':
      case 'solid':
        components = generateReactComponents(projectName);
        break;
      case 'vue':
      case 'nuxt':
        components = generateVueComponents(projectName);
        break;
      case 'svelte':
      case 'sveltekit':
        components = generateSvelteComponents(projectName);
        break;
    }

    for (const [path, content] of Object.entries(components)) {
      files[path] = content;
    }
  },
};
