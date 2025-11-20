function RequestPreview({ resource, params, onParamChange, onSendRequest, loading }) {
  const getSelectedSourceInfo = () => {
    if (!Array.isArray(resource.realApiInfo?.sources)) return null;

    const sourceParam = resource.params?.find(
      (param) => param.name.toLowerCase() === 'source'
    );
    if (!sourceParam) return null;

    const selectedValue = params[sourceParam.name];
    if (!selectedValue) return null;

    const normalizedSelection = selectedValue.toString().toLowerCase();
    const matchedSource = resource.realApiInfo.sources.find((source) => {
      const identifier = source.key || source.name;
      return (
        identifier &&
        identifier.toString().toLowerCase() === normalizedSelection
      );
    });

    return matchedSource || null;
  };

  const getSelectedSourceUrl = () => {
    const selectedSource = getSelectedSourceInfo();
    return selectedSource?.url || null;
  };

  const fillTemplatePlaceholders = (template) => {
    if (!template) return '';
    return template.replace(/\{([^}]+)\}/g, (_, key) => {
      const value = params[key];
      return value !== undefined && value !== null && value !== '' ? value : `{${key}}`;
    });
  };

  const getExternalUrlTemplate = () => {
    if (!resource.realApiInfo) return null;

    const isHttpUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value);

    const selectedSourceUrl = getSelectedSourceUrl();
    if (selectedSourceUrl && isHttpUrl(selectedSourceUrl)) {
      return selectedSourceUrl;
    }

    if (isHttpUrl(resource.realApiInfo.url)) {
      return resource.realApiInfo.url;
    }

    if (Array.isArray(resource.realApiInfo.sources)) {
      const sourceWithUrl = resource.realApiInfo.sources.find((source) => isHttpUrl(source.url));
      if (sourceWithUrl) {
        return sourceWithUrl.url;
      }
    }

    return null;
  };

  const buildRequestUrl = () => {
    const template = getExternalUrlTemplate();
    let url = template ? fillTemplatePlaceholders(template) : resource.endpoint;
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (!value || value === 'false') {
        return;
      }
      if (template && (key === 'source' || key === 'sources')) {
        return;
      }
      queryParams.append(key, value);
    });

    if (queryParams.toString()) {
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}${queryParams.toString()}`;
    }

    return url;
  };

  const selectedSourceInfo = getSelectedSourceInfo();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Request Configuration
      </h2>

      {/* Resource Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">{resource.name}</h3>
        <p className="text-sm text-gray-600">{resource.description}</p>
        {resource.realApiInfo && (
          <div className="mt-3 text-xs text-gray-500">
            <div className="font-medium">Real API Source:</div>
            {Array.isArray(resource.realApiInfo.sources) ? (
              <>
                {selectedSourceInfo && (
                  <div className="mt-1 text-primary-600">
                    <span className="font-semibold">Active:</span>{' '}
                    {selectedSourceInfo.name} &mdash; {selectedSourceInfo.url}
                  </div>
                )}
                {resource.realApiInfo.sources.map((source, idx) => {
                  const isActive =
                    selectedSourceInfo &&
                    (selectedSourceInfo.key || selectedSourceInfo.name) ===
                      (source.key || source.name);
                  return (
                    <div key={idx} className={`mt-1 ${isActive ? 'font-semibold' : ''}`}>
                      <span className="font-medium">{source.name}:</span> {source.url}
                    </div>
                  );
                })}
              </>
            ) : (
              <div>
                <span className="font-medium">{resource.realApiInfo.source}:</span>{' '}
                {resource.realApiInfo.url}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Parameters */}
      <div className="space-y-4 mb-6">
        <h3 className="font-medium text-gray-900">Parameters</h3>
        {resource.params.map((param) => (
          <div key={param.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {param.name}
              {param.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {param.type === 'select' ? (
              <select
                value={params[param.name] || ''}
                onChange={(e) => onParamChange(param.name, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {param.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : param.type === 'checkbox' ? (
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={params[param.name] === true || params[param.name] === 'true'}
                  onChange={(e) => onParamChange(param.name, e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">{param.description}</span>
              </label>
            ) : param.type === 'textarea' ? (
              <textarea
                value={params[param.name] || ''}
                onChange={(e) => onParamChange(param.name, e.target.value)}
                placeholder={param.placeholder}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              />
            ) : (
              <input
                type={param.type}
                value={params[param.name] || ''}
                onChange={(e) => {
                  const value = param.type === 'number' ? parseFloat(e.target.value) || '' : e.target.value;
                  onParamChange(param.name, value);
                }}
                placeholder={param.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            )}
            {param.description && (
              <p className="text-xs text-gray-500 mt-1">{param.description}</p>
            )}
          </div>
        ))}
      </div>

      {/* Request Preview */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-2">
          {resource.method === 'POST' ? 'Request Body' : 'Request URL'}
        </h3>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          {resource.method === 'POST' ? (
            <div>
              <div className="text-gray-400 mb-1">{resource.method} {resource.endpoint}</div>
              <pre className="mt-2 text-xs whitespace-pre-wrap">
                {JSON.stringify(
                  Object.fromEntries(
                    Object.entries(params).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
                  ),
                  null,
                  2
                )}
              </pre>
            </div>
          ) : (
            <div className="text-gray-400 mb-1">{resource.method} {buildRequestUrl()}</div>
          )}
        </div>
      </div>

      {/* Send Button */}
      <button
        onClick={onSendRequest}
        disabled={loading || (resource.params.some(p => p.required && !params[p.name]))}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
          loading || (resource.params.some(p => p.required && !params[p.name]))
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sending Request...
          </span>
        ) : (
          'Send Request'
        )}
      </button>
    </div>
  );
}

export default RequestPreview;

