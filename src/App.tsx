import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Home } from '@/pages/Home';
import { CardBrowser } from '@/pages/CardBrowser';
import { Collection } from '@/pages/Collection';
import { Decks } from '@/pages/Decks';
import { DeckBuilder } from '@/pages/DeckBuilder';
import { Scanner } from '@/pages/Scanner';
import { Settings } from '@/pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/cards" element={<CardBrowser />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/decks" element={<Decks />} />
          <Route path="/decks/:id" element={<DeckBuilder />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
