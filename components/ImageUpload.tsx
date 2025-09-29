import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloudIcon } from './icons/UploadCloudIcon';
import { XIcon } from './icons/XIcon';
import { SendIcon } from './icons/SendIcon';

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  disabled: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload, disabled }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  }, []);

  useEffect(() => {
    // Revoke the data uris to avoid memory leaks
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    multiple: false,
    disabled: disabled || !!file,
  });

  const handleAnalyze = () => {
    if (file) {
      onImageUpload(file);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setPreview(null);
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  if (file && preview) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-8">
        <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900/50 p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-200">Confirm Bet Slip</h3>
            <div className="mt-4 relative group w-full h-48 bg-gray-800 rounded-lg overflow-hidden border border-gray-600">
                <img src={preview} alt="Bet slip preview" className="w-full h-full object-contain" />
            </div>
            <div className="mt-4 text-left bg-gray-800/70 p-3 rounded-md">
                <p className="truncate text-sm font-medium text-gray-300">{file.name}</p>
                <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
            </div>
            <div className="mt-6 flex justify-between gap-4">
                <button
                    onClick={handleCancel}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-300 transition-colors hover:bg-gray-600"
                >
                    <XIcon className="h-5 w-5" />
                    Cancel
                </button>
                <button
                    onClick={handleAnalyze}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600"
                >
                    <SendIcon className="h-5 w-5" />
                    Analyze
                </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div
        {...getRootProps()}
        className={`flex w-full max-w-2xl cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed  p-12 text-center transition-colors ${
          isDragActive ? 'border-cyan-400 bg-cyan-500/10' : 'border-gray-600 hover:border-cyan-500 hover:bg-gray-800/60'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-700">
          <UploadCloudIcon className="h-8 w-8 text-cyan-400" />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-gray-200">
          {isDragActive ? 'Drop the image here ...' : 'Upload Your Bet Slip'}
        </h3>
        <p className="mt-2 text-gray-400">
          Drag & drop a screenshot of your bet slip, or click to select a file.
        </p>
        <p className="mt-1 text-xs text-gray-500">
          PNG, JPG, or WEBP files accepted.
        </p>
      </div>
    </div>
  );
};

export default ImageUpload;