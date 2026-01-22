import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import SeedGeneratorPage from './pages/SeedGeneratorPage';
import StackComposerPage from './pages/StackComposerPage';
import TemplateSelectorPage from './pages/TemplateSelectorPage';
import SeedGalleryPage from './pages/SeedGalleryPage';

/**
 * UPG Desktop Application
 *
 * Dual-mode generation supporting:
 * 1. Manifest Mode: Select template -> RJSF form -> Copier sidecar
 * 2. Procedural Mode: Seed generator / Stack composer -> Procedural engine
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="seed" element={<SeedGeneratorPage />} />
        <Route path="compose" element={<StackComposerPage />} />
        <Route path="templates" element={<TemplateSelectorPage />} />
        <Route path="gallery" element={<SeedGalleryPage />} />
      </Route>
    </Routes>
  );
}

export default App;
