export interface RequestFormData {
  name: string;
  reason: string;
  contactEmail?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface Request {
  id: string;
  name: string;
  reason: string;
  timestamp: string;
  status: 'pending' | 'in-progress' | 'completed';
  location: {
    lat: number;
    lng: number;
  };
  contactEmail?: string;
  priority: 'low' | 'medium' | 'high';
}

// PathLocation represents a single point in a path
export interface PathLocation {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  completed: boolean;
}

// Path represents a complete route with multiple connected points
export interface Path {
  id: string;
  name: string;
  description: string;
  locations: PathLocation[];
  isActive: boolean;
  createdAt: string;
  estimatedDistance: number;
  estimatedTime: number;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
}

export interface PathFormData {
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
} 