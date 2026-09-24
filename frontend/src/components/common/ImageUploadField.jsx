export default function ImageUploadField({ label, value, onChange }) {
  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-3 mt-1">
        {value ? (
          <img src={value} className="w-14 h-14 rounded-xl object-cover border border-pink-100" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-pink-soft" />
        )}
        <input type="file" accept="image/*" onChange={handleFile} className="text-xs" />
      </div>
    </div>
  );
}
