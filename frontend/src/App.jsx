import { useState } from 'react';
import ResourceSelector from './components/ResourceSelector';
import RequestPreview from './components/RequestPreview';
import ResponseViewer from './components/ResponseViewer';
import { resources } from './config/resources';

function App() {
  const [selectedResource, setSelectedResource] = useState(null);
  const [requestParams, setRequestParams] = useState({});
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleResourceSelect = (resource) => {
    setSelectedResource(resource);
    setRequestParams(resource.defaultParams || {});
    setResponse(null);
    setError(null);
  };

  const handleParamChange = (key, value) => {
    setRequestParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSendRequest = async () => {
    if (!selectedResource) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      let url = selectedResource.endpoint;
      let options = {
        method: selectedResource.method || 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (selectedResource.method === 'POST') {
        // For POST requests, send params in body
        const body = {};
        Object.entries(requestParams).forEach(([key, value]) => {
          // Handle special types
          if (key === 'packages' && typeof value === 'string') {
            try {
              body[key] = JSON.parse(value);
            } catch (e) {
              body[key] = value;
            }
          } else if (key === 'sources' && typeof value === 'string') {
            body[key] = value.split(',').map(s => s.trim());
          } else if (typeof value === 'string' && (value === 'true' || value === 'false')) {
            body[key] = value === 'true';
          } else if (value !== '' && value !== null && value !== undefined) {
            body[key] = value;
          }
        });
        options.body = JSON.stringify(body);
      } else {
        // For GET requests, add params to query string
        const queryParams = new URLSearchParams();
        Object.entries(requestParams).forEach(([key, value]) => {
          if (value && value !== 'false' && value !== '') {
            queryParams.append(key, value);
          }
        });
        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }
      }

      const response = await fetch(url, options);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      setResponse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Data Collection Playground
          </h1>
          <p className="text-gray-600">
            Explore ChainGuard's data collection resources for Supply Chain Security
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Resource Selector */}
          <div className="lg:col-span-1">
            <ResourceSelector
              resources={resources}
              selectedResource={selectedResource}
              onSelect={handleResourceSelect}
            />
          </div>

          {/* Right Column: Request & Response */}
          <div className="lg:col-span-2 space-y-6">
            {selectedResource ? (
              <>
                <RequestPreview
                  resource={selectedResource}
                  params={requestParams}
                  onParamChange={handleParamChange}
                  onSendRequest={handleSendRequest}
                  loading={loading}
                />
                <ResponseViewer
                  response={response}
                  error={error}
                  loading={loading}
                />
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-500 text-lg">
                  Select a resource from the left to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

