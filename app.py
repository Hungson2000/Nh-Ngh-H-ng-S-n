from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker

from models import Base, Booking, Promo, Review, Service


def create_app():
    app = Flask(__name__)
    CORS(app)

    # Ưu tiên env
    import os
    db_url = os.environ.get('DATABASE_URL', '').strip()
    if not db_url:
        # SQLite chạy được ngay
        db_url = 'sqlite:///hungson.db'


    engine = create_engine(
        db_url,
        echo=False,
        future=True,
    )

    Base.metadata.create_all(engine)

    SessionLocal = scoped_session(sessionmaker(bind=engine, autoflush=False, autocommit=False))

    def get_session():
        return SessionLocal

    # ================== BOOKING ==================
    @app.get('/api/bookings')
    def list_bookings():
        db = get_session()
        rows = db.query(Booking).order_by(Booking.id.desc()).all()
        return jsonify([r.to_dict() for r in rows])

    @app.post('/api/bookings')
    def create_booking():
        db = get_session()
        data = request.get_json(force=True) or {}
        try:
            obj = Booking.from_dict(data)
            db.add(obj)
            db.commit()
            db.refresh(obj)
            return jsonify({'success': True, 'booking': obj.to_dict()})
        except Exception as e:
            db.rollback()
            return jsonify({'success': False, 'error': str(e)}), 400

    @app.put('/api/bookings/<int:booking_id>')
    def update_booking(booking_id):
        db = get_session()
        data = request.get_json(force=True) or {}
        obj = db.query(Booking).filter(Booking.id == booking_id).first()
        if not obj:
            return jsonify({'error': 'Not found'}), 404
        for k, v in data.items():
            if hasattr(obj, k):
                setattr(obj, k, v)
        db.commit()
        return jsonify(obj.to_dict())

    # ================== REVIEW ==================
    @app.get('/api/reviews')
    def list_reviews():
        db = get_session()
        rows = db.query(Review).order_by(Review.id.desc()).all()
        return jsonify([r.to_dict() for r in rows])

    @app.post('/api/reviews')
    def create_review():
        db = get_session()
        data = request.get_json(force=True) or {}
        try:
            obj = Review.from_dict(data)
            db.add(obj)
            db.commit()
            db.refresh(obj)
            return jsonify({'success': True, 'review': obj.to_dict()})
        except Exception as e:
            db.rollback()
            return jsonify({'success': False, 'error': str(e)}), 400

    @app.delete('/api/reviews/<int:review_id>')
    def delete_review(review_id):
        db = get_session()
        obj = db.query(Review).filter(Review.id == review_id).first()
        if not obj:
            return jsonify({'success': True})
        db.delete(obj)
        db.commit()
        return jsonify({'success': True})

    # ================== SERVICE ==================
    @app.get('/api/services')
    def list_services():
        db = get_session()
        rows = db.query(Service).order_by(Service.id.desc()).all()
        return jsonify([r.to_dict() for r in rows])

    @app.post('/api/services')
    def create_service():
        db = get_session()
        data = request.get_json(force=True) or {}
        try:
            obj = Service.from_dict(data)
            db.add(obj)
            db.commit()
            db.refresh(obj)
            return jsonify({'success': True, 'service': obj.to_dict()})
        except Exception as e:
            db.rollback()
            return jsonify({'success': False, 'error': str(e)}), 400

    @app.put('/api/services/<int:service_id>')
    def update_service(service_id):
        db = get_session()
        data = request.get_json(force=True) or {}
        obj = db.query(Service).filter(Service.id == service_id).first()
        if not obj:
            return jsonify({'error': 'Not found'}), 404
        for k, v in data.items():
            if hasattr(obj, k):
                setattr(obj, k, v)
        db.commit()
        return jsonify(obj.to_dict())

    # ================== PROMO ==================
    @app.get('/api/promos')
    def list_promos():
        db = get_session()
        rows = db.query(Promo).order_by(Promo.id.desc()).all()
        return jsonify([r.to_dict() for r in rows])

    @app.post('/api/promos')
    def create_promo():
        db = get_session()
        data = request.get_json(force=True) or {}
        try:
            obj = Promo.from_dict(data)
            db.add(obj)
            db.commit()
            db.refresh(obj)
            return jsonify({'success': True, 'promo': obj.to_dict()})
        except Exception as e:
            db.rollback()
            return jsonify({'success': False, 'error': str(e)}), 400

    @app.delete('/api/promos/<int:promo_id>')
    def delete_promo(promo_id):
        db = get_session()
        obj = db.query(Promo).filter(Promo.id == promo_id).first()
        if not obj:
            return jsonify({'success': True})
        db.delete(obj)
        db.commit()
        return jsonify({'success': True})

    return app


app = create_app()

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', '5000'))
    app.run(host='0.0.0.0', port=port, debug=True)

