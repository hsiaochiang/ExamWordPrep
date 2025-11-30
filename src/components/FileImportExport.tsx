import { ChangeEvent } from 'react';
import { AppData } from '../utils/jsonSchema';

type Props = {
  data: AppData;
  onImport: (data: AppData, mode: 'merge' | 'replace') => void;
};

export default function FileImportExport({ data, onImport }: Props) {
  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text) as AppData;
      const mode = window.confirm('要覆蓋現有資料嗎？按「確定」覆蓋，按「取消」進行合併。') ? 'replace' : 'merge';
      onImport(parsed, mode);
    } catch (err) {
      alert('檔案解析失敗，請確認 JSON 格式。');
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `wordsite-backup-${ts}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card">
      <h3>匯入 / 匯出 JSON</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="file" accept="application/json" onChange={handleFile} />
        <button className="btn secondary" onClick={handleExport}>匯出目前資料</button>
      </div>
      <p style={{ color: '#6b7280' }}>匯入會將 users / records / userSettings 一併處理，請定期匯出備份。</p>
    </div>
  );
}
