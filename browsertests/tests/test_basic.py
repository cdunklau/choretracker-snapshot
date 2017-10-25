import time
from urllib.parse import urlparse


def test_tasks_navigation(firefox):
    browser = firefox
    tasks_link = browser.find_element_by_css_selector(
        'nav.NavBar > a[href="/tasks"]')
    tasks_link.click()
    #time.sleep(1)
    assert urlparse(browser.current_url).path == '/tasks'


def test_home_navigation(firefox):
    browser = firefox
    tasks_link = browser.find_element_by_css_selector(
        'nav.NavBar > a[href="/tasks"]')
    tasks_link.click()
    home_link = browser.find_element_by_css_selector(
        'nav.NavBar > a[href="/"]')
    home_link.click()
    assert urlparse(browser.current_url).path == '/'
