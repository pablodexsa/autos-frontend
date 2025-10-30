import React from 'react';

export default function ConfirmDialog({ isOpen, onConfirm, onCancel, message }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-900 text-gray-100 rounded-2xl p-6 w-80 shadow-lg">
        <p className="text-center mb-4">{message}</p>
        <div className="flex justify-center gap-4">
          <button onClick={onCancel} className="px-4 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1 bg-red-600 hover:bg-red-500 rounded-lg"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
