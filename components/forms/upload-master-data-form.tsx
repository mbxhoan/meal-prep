'use client';

import { useState } from 'react';

type ImportResponse = {
  ok: boolean;
  summary: {
    sheets: number;
    insertedOrUpdated: number;
    errors: number;
  };
  detail: Array<{
    sheet: string;
    row: number;
    message: string;
  }>;
};

export function UploadMasterDataForm() {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setResult(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch('/api/import/master-data', {
        method: 'POST',
        body: formData
      });

      const payload = (await response.json()) as ImportResponse;
      setResult(payload);

      if (!response.ok || !payload.ok) {
        setError('Import chưa thành công. Xem chi tiết lỗi bên dưới.');
      }
    } catch {
      setError('Không thể gửi file lên server.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="stack-lg">
      <form onSubmit={handleSubmit} className="upload-card">
        <div>
          <p className="section-title">Upload workbook</p>
          <p className="muted">Chỉ nhận file `.xlsx`. Route này sẽ validate trước khi upsert.</p>
        </div>

        <input name="file" type="file" accept=".xlsx" required className="file-input" />

        <button className="primary-button" disabled={submitting} type="submit">
          {submitting ? 'Đang import...' : 'Bắt đầu import'}
        </button>
      </form>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      {result ? (
        <section className="result-card">
          <div className="result-grid">
            <div>
              <span className="muted">Số sheet đọc được</span>
              <p className="result-number">{result.summary.sheets}</p>
            </div>
            <div>
              <span className="muted">Insert/Update</span>
              <p className="result-number">{result.summary.insertedOrUpdated}</p>
            </div>
            <div>
              <span className="muted">Lỗi</span>
              <p className="result-number">{result.summary.errors}</p>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sheet</th>
                  <th>Row</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {result.detail.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <div className="empty-state">Không có lỗi. Workbook đã được xử lý thành công.</div>
                    </td>
                  </tr>
                ) : (
                  result.detail.map((item, index) => (
                    <tr key={`${item.sheet}-${item.row}-${index}`}>
                      <td>{item.sheet}</td>
                      <td>{item.row}</td>
                      <td>{item.message}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
