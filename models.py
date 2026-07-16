from sqlalchemy import String, Integer, Float
from sqlalchemy.orm import declarative_base

from sqlalchemy import Column

Base = declarative_base()


def _as_str(x):
    return None if x is None else str(x)


class Booking(Base):
    __tablename__ = 'bookings'

    id = Column(Integer, primary_key=True, autoincrement=True)

    code = Column(String, unique=True, index=True)
    name = Column(String)
    phone = Column(String)
    email = Column(String)

    room = Column(String)
    checkin = Column(String)
    checkout = Column(String)

    nights = Column(Integer)
    total = Column(Integer)

    status = Column(String, default='new')
    createdAt = Column(String)

    @staticmethod
    def from_dict(d: dict) -> 'Booking':
        o = Booking()
        # map field names from existing frontend/backend
        o.code = _as_str(d.get('code'))
        o.name = _as_str(d.get('name'))
        o.phone = _as_str(d.get('phone'))
        o.email = _as_str(d.get('email'))
        o.room = _as_str(d.get('room'))
        o.checkin = _as_str(d.get('checkin'))
        o.checkout = _as_str(d.get('checkout'))
        o.nights = d.get('nights')
        o.total = d.get('total')
        o.status = _as_str(d.get('status')) or 'new'
        o.createdAt = _as_str(d.get('createdAt'))
        # Support client sending id
        return o

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'phone': self.phone,
            'email': self.email,
            'room': self.room,
            'checkin': self.checkin,
            'checkout': self.checkout,
            'nights': self.nights,
            'total': self.total,
            'status': self.status,
            'createdAt': self.createdAt,
        }


class Promo(Base):
    __tablename__ = 'promos'

    id = Column(Integer, primary_key=True, autoincrement=True)

    from_ = Column(String)
    to_ = Column(String)

    apply = Column(String)
    percent = Column(Integer)
    label = Column(String)

    @staticmethod
    def from_dict(d: dict) -> 'Promo':
        o = Promo()
        o.from_ = _as_str(d.get('from') or d.get('from_'))
        o.to_ = _as_str(d.get('to') or d.get('to_'))
        o.apply = _as_str(d.get('apply'))
        o.percent = d.get('percent')
        o.label = _as_str(d.get('label'))
        return o

    def to_dict(self):
        return {
            'id': self.id,
            'from': self.from_,
            'to': self.to_,
            'apply': self.apply,
            'percent': self.percent,
            'label': self.label,
        }


class Service(Base):
    __tablename__ = 'services'

    id = Column(Integer, primary_key=True, autoincrement=True)

    name = Column(String)
    room = Column(String)
    date = Column(String)
    time = Column(String)

    services = Column(String)
    total = Column(Integer)
    note = Column(String)

    status = Column(String, default='new')
    createdAt = Column(String)

    @staticmethod
    def from_dict(d: dict) -> 'Service':
        o = Service()
        o.name = _as_str(d.get('name'))
        o.room = _as_str(d.get('room'))
        o.date = _as_str(d.get('date'))
        o.time = _as_str(d.get('time'))
        o.services = _as_str(d.get('services'))
        o.total = d.get('total')
        o.note = _as_str(d.get('note'))
        o.status = _as_str(d.get('status')) or 'new'
        o.createdAt = _as_str(d.get('createdAt'))
        return o

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'room': self.room,
            'date': self.date,
            'time': self.time,
            'services': self.services,
            'total': self.total,
            'note': self.note,
            'status': self.status,
            'createdAt': self.createdAt,
        }


class Review(Base):
    __tablename__ = 'reviews'

    id = Column(Integer, primary_key=True, autoincrement=True)

    name = Column(String)
    text = Column(String)
    room = Column(String)
    star = Column(Integer)
    date = Column(String)

    @staticmethod
    def from_dict(d: dict) -> 'Review':
        o = Review()
        o.name = _as_str(d.get('name'))
        o.text = _as_str(d.get('text'))
        o.room = _as_str(d.get('room'))
        o.star = d.get('star')
        o.date = _as_str(d.get('date'))
        return o

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'text': self.text,
            'room': self.room,
            'star': self.star,
            'date': self.date,
        }

