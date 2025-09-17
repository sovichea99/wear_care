import { useState } from "react";

export default function AddCategoryForm({ onAdd, onCancel }) {
  const [newCategory, setNewCategory] = useState({
    name: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewCategory((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try{
      await onAdd(newCategory);
      setNewCategory({name:''}); //reset the form after successful submit
    }finally{
      setIsSubmitting(false);
    }
  }


  return (
    <div className="modal fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50">
      <div className="modal-content bg-white p-4 rounded-xl shadow-lg w-[400px]">
        <h2 className="text-xl font-bold mb-3">Add Category</h2>
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2 mb-3">
            <div className="w-1/2">
              <label className="block text-xs font-medium mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={newCategory.name}
                onChange={handleChange}
                className="w-full p-1.5 text-sm border rounded"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-between mt-4">
            <button
              type="submit"
              className="bg-pink-500 text-white text-sm px-3 py-1.5 rounded"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : 'Add Category'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="bg-red-500 text-white text-sm px-3 py-1.5 rounded"
               disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
