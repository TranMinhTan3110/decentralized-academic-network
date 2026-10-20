import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DocumentGrid, EmptyState, DocumentList } from '../../components/ui';
import { mockTestDocuments } from '../fixtures/documents.fixture';

describe('DocumentGrid & DocumentList Components', () => {
  it('renders grid with document cards', () => {
    render(
      <MemoryRouter>
        <DocumentGrid items={mockTestDocuments.slice(0, 2)} />
      </MemoryRouter>
    );
    expect(screen.getAllByText(mockTestDocuments[0].title).length).toBeGreaterThan(0);
    expect(screen.getAllByText(mockTestDocuments[1].title).length).toBeGreaterThan(0);
  });

  it('renders EmptyState correctly', () => {
    render(
      <EmptyState title="Không tìm thấy" description="Vui lòng thử từ khóa khác">
        <button>Thử lại</button>
      </EmptyState>
    );

    expect(screen.getByText('Không tìm thấy')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng thử từ khóa khác')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
  });

  it('renders DocumentList with empty state when items list is empty', () => {
    render(
      <MemoryRouter>
        <DocumentList items={[]} />
      </MemoryRouter>
    );
    expect(screen.getByText('Không có tài liệu')).toBeInTheDocument();
  });
});
