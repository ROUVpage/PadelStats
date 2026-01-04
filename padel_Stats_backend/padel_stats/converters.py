class FloatConverter:
    regex = '-?[\d.]+' # Acepta números positivos y negativos con decimales
    
    def to_python(self, value):
        return float(value)
        
    def to_url(self, value):
        return str(value)