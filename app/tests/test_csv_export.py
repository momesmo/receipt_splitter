from streamlit_domain.csv_export import build_csv_content
from streamlit_domain.models import CustomSplit, Item, Person


def test_build_csv_content_escapes_quotes() -> None:
    people = [Person(id="a", name='A"lice'), Person(id="b", name="Bob")]
    items = [Item(id="1", name='Item "quoted"', cost=1.5, payer="a", custom=CustomSplit(values={}))]
    csv = build_csv_content(people, items, 0, 0)
    assert '""' in csv
    assert len(csv.split("\n")) > 3
