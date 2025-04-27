
import React from 'react';
import { Label } from "@/components/ui/label";
import { getResponseBadgeColor, getResponseMessage } from '@/utils/http-utils';
import { HttpConfig } from '@/types/form';

interface HttpResponsePreviewProps {
  testResponse: { status: number; data: string } | null;
  config: HttpConfig;
}

const HttpResponsePreview: React.FC<HttpResponsePreviewProps> = ({
  testResponse,
  config
}) => {
  if (!testResponse && !config.lastResponse) return null;

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between">
        <Label className="text-md font-medium">
          Resultado de la última prueba
        </Label>
        <div className="text-xs text-gray-500">
          {config.lastResponse && (
            <span>
              Última actualización: {new Date(config.lastResponse.timestamp).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
            getResponseBadgeColor(testResponse?.status || config.lastResponse?.status || 0)
          }`}>
            Código {testResponse?.status || config.lastResponse?.status}
          </span>
          <span className="text-sm text-gray-600">
            {getResponseMessage(testResponse?.status || config.lastResponse?.status || 0)}
          </span>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Respuesta del servidor:</Label>
          <pre className="bg-white p-3 rounded border text-sm overflow-x-auto">
            {testResponse?.data || config.lastResponse?.data || "Sin datos"}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default HttpResponsePreview;
