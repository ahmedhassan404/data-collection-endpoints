import { resources } from '../config/resources';

// Organize resources by category
const categorizeResources = (resources) => {
  const categories = {
    'Package Data': [],
    'Security & Vulnerabilities': [],
    'Code Analysis': [],
    'Training Data': [],
    'Collection Orchestrator': []
  };

  resources.forEach(resource => {
    if (resource.id.includes('collection-')) {
      categories['Collection Orchestrator'].push(resource);
    } else if (resource.id.includes('malicious') || resource.id.includes('benign')) {
      categories['Training Data'].push(resource);
    } else if (resource.id.includes('vulnerabilities') || resource.id.includes('static-analysis')) {
      categories['Security & Vulnerabilities'].push(resource);
    } else if (resource.id.includes('github') || resource.id.includes('static')) {
      categories['Code Analysis'].push(resource);
    } else {
      categories['Package Data'].push(resource);
    }
  });

  return categories;
};

function ResourceSelector({ resources, selectedResource, onSelect }) {
  const categorized = categorizeResources(resources);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Data Collection Resources
      </h2>
      <div className="space-y-6">
        {Object.entries(categorized).map(([category, categoryResources]) => {
          if (categoryResources.length === 0) return null;
          
          return (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryResources.map((resource) => (
                  <button
                    key={resource.id}
                    onClick={() => onSelect(resource)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedResource?.id === resource.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">{resource.name}</div>
                        <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {resource.description}
                        </div>
                      </div>
                      {resource.method === 'POST' && (
                        <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          POST
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ResourceSelector;

