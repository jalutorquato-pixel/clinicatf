import { useState, useEffect } from 'react';
import { Search, Download, X, CheckCircle, AlertCircle, Info } from 'lucide-react';

/* ==========================================================================
   1. DataTable
   ========================================================================== */
export function DataTable({ columns, data }) {
  if (!data || data.length === 0) {
    return <div className="no-data">Nenhum dado encontrado.</div>;
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col, colIndex) => (
                <td key={colIndex}>
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ==========================================================================
   2. SearchInput
   ========================================================================== */
export function SearchInput({ value, onChange, placeholder = "Buscar..." }) {
  return (
    <div className="search-input-wrapper">
      <Search className="search-icon" size={18} />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="search-input"
      />
    </div>
  );
}

/* ==========================================================================
   3. StatusBadge
   ========================================================================== */
export function StatusBadge({ status }) {
  const statusLower = String(status).toLowerCase();
  let badgeClass = 'badge-default';

  if (['ativo', 'concluído', 'pago', 'aprovado'].includes(statusLower)) {
    badgeClass = 'badge-success';
  } else if (['inativo', 'cancelado', 'atrasado', 'reprovado'].includes(statusLower)) {
    badgeClass = 'badge-danger';
  } else if (['pendente', 'aguardando', 'em andamento'].includes(statusLower)) {
    badgeClass = 'badge-warning';
  }

  return (
    <span className={`status-badge ${badgeClass}`}>
      {status}
    </span>
  );
}

/* ==========================================================================
   4. Modal
   ========================================================================== */
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   5. FormField
   ========================================================================== */
export function FormField({ label, children }) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

/* ==========================================================================
   6. MetricCard
   ========================================================================== */
export function MetricCard({ title, value, icon: Icon }) {
  return (
    <div className="metric-card card">
      <div className="metric-content">
        <h4 className="metric-title">{title}</h4>
        <div className="metric-value">{value}</div>
      </div>
      {Icon && (
        <div className="metric-icon">
          <Icon size={24} />
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   7. CsvExportButton
   ========================================================================== */
export function CsvExportButton({ data, filename = 'export.csv' }) {
  const handleExport = () => {
    if (!data || !data.length) return;

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row)
        .map(val => `"${String(val).replace(/"/g, '""')}"`)
        .join(',')
    );
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button onClick={handleExport} className="btn-secondary csv-export-btn">
      <Download size={16} />
      Exportar CSV
    </button>
  );
}

/* ==========================================================================
   8. Toast
   ========================================================================== */
export function Toast({ message, type = 'info', duration = 3000, onClose }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertCircle : Info;

  return (
    <div className={`toast toast-${type}`}>
      <Icon size={18} className="toast-icon" />
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="toast-close">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
