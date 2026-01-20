from rest_framework.pagination import CursorPagination
from rest_framework.response import Response


class StandardCursorPagination(CursorPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    ordering = '-created_at'

    def get_paginated_response(self, data):
        return Response({
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'count': len(data),
            'results': data
        })


class LargeResultsSetPagination(StandardCursorPagination):
    page_size = 50
    max_page_size = 500


class SmallResultsSetPagination(StandardCursorPagination):
    page_size = 10
    max_page_size = 50
