import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DocumentGrid, EmptyState, DocumentList } from '../../components/ui';
import { documents } from '../../data/documents';

describe('DocumentGrid & DocumentList Components', () => {
  it('renders grid with document cards', () => {
    render(<DocumentGrid items={documents.slice(0, 2)} />);
    expect(screen.getAllByText(documents[0].title).length).toBeGreaterThan(0);
    expect(screen.getAllByText(documents[1].title).length).toBeGreaterThan(0);
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
    render(<DocumentList items={[]} />);
    expect(screen.getByText('Không có tài liệu')).toBeInTheDocument();
  });
});
