from .crud import make_crud_router

router = make_crud_router("sensor_readings", "/sensors", "Sensors")
