import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import './CustomSelect.css';

export default function CustomSelect({
  label,
  value,
  options = [],
  onChange,
  placeholder = 'Selecione...',
  searchable = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen, searchable]);

  // Normalize options to { value, label }
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'object' && opt !== null) {
      return { value: opt.value ?? opt.label, label: opt.label ?? opt.value };
    }
    return { value: opt, label: String(opt) };
  });

  // Filter options by search term if searchable
  const filteredOptions = normalizedOptions.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = normalizedOptions.find(opt => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : (value || placeholder);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  // Determine if search should be enabled automatically for long lists
  const isSearchEnabled = searchable || normalizedOptions.length > 8;

  return (
    <div className="custom-select-container" ref={dropdownRef}>
      {label && <span className="custom-select-label">{label}</span>}
      <button
        type="button"
        className={`custom-select-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="custom-select-value" title={displayLabel}>
          {displayLabel}
        </span>
        <ChevronDown size={15} className={`custom-select-chevron ${isOpen ? 'rotated' : ''}`} />
      </button>

      {isOpen && (
        <div className="custom-select-dropdown">
          {isSearchEnabled && (
            <div className="custom-select-search-box">
              <Search size={14} className="custom-select-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
            </div>
          )}

          <div className="custom-select-options-list" role="listbox">
            {filteredOptions.length === 0 ? (
              <div className="custom-select-empty">Nenhum resultado</div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(opt.value)}
                  >
                    <span className="custom-select-option-text">{opt.label}</span>
                    {isSelected && <Check size={14} className="custom-select-check" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
