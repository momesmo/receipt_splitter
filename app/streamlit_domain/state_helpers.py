from __future__ import annotations

from uuid import uuid4

from .models import CustomSplit, Item, Person


def generate_person_id() -> str:
    return f"person-{uuid4()}"


def generate_item_id() -> str:
    return f"item-{uuid4()}"


def create_default_people() -> list[Person]:
    return [
        Person(id=generate_person_id(), name="Person 1"),
        Person(id=generate_person_id(), name="Person 2"),
    ]


def create_empty_item() -> Item:
    return Item(id=generate_item_id(), custom=CustomSplit(type="percent", values={}))


def sync_custom_values_with_people(item: Item, people: list[Person]) -> Item:
    values = {person.id: item.custom.values.get(person.id, "") for person in people}
    return Item(
        id=item.id,
        name=item.name,
        cost=item.cost,
        payer=item.payer,
        custom=CustomSplit(type=item.custom.type, values=values),
    )


def sync_all_items_people(items: list[Item], people: list[Person]) -> list[Item]:
    return [sync_custom_values_with_people(item, people) for item in items]
