import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { adminService } from '../../services';

const AssignStationModal = ({ staff, isOpen, onClose, onAssign }) => {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await adminService.getAllStations();
        const stationsData = response?.data || response || [];
        setStations(Array.isArray(stationsData) ? stationsData : []);
      } catch (error) {
        console.error('Error fetching stations:', error);
        alert('Không thể tải danh sách trạm');
      }
    };

    if (isOpen) {
      fetchStations();
      // Reset selectedStation when modal opens
      setSelectedStation(staff?.assignedStation?._id || '');
    }
  }, [isOpen, staff]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStation || !staff?._id) return;

    setLoading(true);
    try {
      await adminService.assignStaffToStation(staff._id, selectedStation);
      onAssign?.();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Không thể phân công trạm';
      alert(errorMsg);
    } finally {
      setLoading(false);
      onClose?.();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold mb-4">Phân công trạm</h3>
        <p className="text-gray-600 mb-4">
          Phân công trạm cho nhân viên: {staff?.fullName || 'Không xác định'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn trạm
            </label>
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">-- Chọn trạm --</option>
              {stations.map((station) => (
                <option key={station._id} value={station._id}>
                  {station.name} - {station.address?.district || 'Không có địa chỉ'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !selectedStation}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Phân công'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

AssignStationModal.propTypes = {
  staff: PropTypes.shape({
    _id: PropTypes.string,
    fullName: PropTypes.string,
    assignedStation: PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string
    })
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAssign: PropTypes.func
};

AssignStationModal.defaultProps = {
  staff: null,
  onAssign: () => {}
};

export default AssignStationModal;