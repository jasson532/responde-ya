import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import Input from 'modules/shared/components/atoms/Input/Input';
import useDebounce from 'modules/shared/hooks/useDebounce';
import './SearchBar.scss';

export interface SearchBarProps {
  /** Se dispara con el valor ya debounced. */
  onSearch: (query: string) => void;
  placeholder?: string;
  label?: string;
  initialValue?: string;
  debounceMs?: number;
  autoFocus?: boolean;
}

const SearchBar = ({
  onSearch,
  placeholder = 'Busca una emergencia: quemadura, atragantamiento...',
  label = 'Buscar contenido de primeros auxilios',
  initialValue = '',
  debounceMs = 300,
  autoFocus = false,
}: SearchBarProps) => {
  const [query, setQuery] = useState(initialValue);
  const debouncedQuery = useDebounce(query, debounceMs);

  useEffect(() => {
    onSearch(debouncedQuery.trim());
  }, [debouncedQuery, onSearch]);

  return (
    <div className="search-bar" role="search" data-testid="SearchBar">
      <span className="search-bar__icon" aria-hidden="true">
        <Search />
      </span>

      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        autoFocus={autoFocus}
        className="search-bar__input"
      />

      {query.length > 0 && (
        <button
          type="button"
          className="search-bar__clear"
          onClick={() => setQuery('')}
          aria-label="Limpiar búsqueda"
        >
          <X aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
