import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "@/contexts/form/FormContext";

export const useFormValidation = () => {
  const { id } = useParams();
  const { getForm } = useForm();
  const [form, setForm] = useState<any>(null);
  const [accessValidated, setAccessValidated] = useState(false);
  const [validationLoading, setValidationLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      console.error("Form ID is missing");
      setValidationLoading(false);
      return;
    }

    const fetchForm = async () => {
      try {
        const formData = getForm(id);
        if (formData) {
          setForm(formData);
        } else {
          console.error("Form not found");
        }
      } catch (error) {
        console.error("Error fetching form:", error);
      } finally {
        setValidationLoading(false);
      }
    };

    fetchForm();
  }, [id, getForm]);

  return { form, accessValidated, validationLoading, setAccessValidated };
};

