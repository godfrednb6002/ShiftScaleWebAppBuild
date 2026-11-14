import unittest

from fastapi.testclient import TestClient

from main import app


class TestDataset3Task(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_dataset_3_task_exists(self) -> None:
        response = self.client.get('/api/tasks/dataset-3')
        self.assertEqual(response.status_code, 200, response.text)
        body = response.json()
        self.assertEqual(body['id'], 3)
        self.assertEqual(body['dataset'], 'SRTM')
        self.assertEqual(body['name'], 'NASA SRTM Terrain Analysis')
        self.assertIn('elevation', body['summary'].lower())

    def test_tasks_list_includes_dataset_3(self) -> None:
        response = self.client.get('/api/tasks')
        self.assertEqual(response.status_code, 200, response.text)
        tasks = response.json()
        self.assertTrue(any(task['id'] == 3 for task in tasks))
